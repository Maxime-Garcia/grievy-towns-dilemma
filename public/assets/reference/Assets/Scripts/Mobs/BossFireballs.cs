using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BossFireballs : MonoBehaviour {
    public float speed = 10f;
    public Vector3 direction;
    public float TimeTillDestroy;
    public float dammages;
    private GameObject player;


    private void Start()
    {
        player = GameObject.FindWithTag("Player");
        
        var dir = this.direction;
        var angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
        transform.rotation = Quaternion.AngleAxis(angle, Vector3.forward);

        direction.Normalize();
        this.gameObject.GetComponent<Rigidbody2D>().velocity = direction * speed;

        Destroy(gameObject, TimeTillDestroy);

    }
   
    
    void OnCollisionEnter2D(Collision2D col)
    {
        if (col.gameObject.tag.Equals("Player"))
        {
            player.GetComponent<PlayerHealth>().TakeAHit(dammages);
            Destroy(gameObject);
            player.GetComponent<Rigidbody2D>().velocity = Vector3.zero;

        }
        else
        {
            Destroy(gameObject);
        }
    }
    
}