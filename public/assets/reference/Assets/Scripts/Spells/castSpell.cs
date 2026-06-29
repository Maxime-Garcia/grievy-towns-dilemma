using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

public class castSpell : MonoBehaviour
{
    public int damages;
    public float speed;
    public float destroyTime;
    public Vector3 direction;
    public float angleVariation;
    public GameObject FireTrail;
    
    private Animator anim;
    private AudioSource audio;


    private void Awake()
    {

    }

    private void Start()
    {
        string objectName = gameObject.name;
        objectName = objectName.Substring(0, objectName.Length - 7);
        
        var pos = Camera.main.WorldToScreenPoint(transform.position);
        var dir = Input.mousePosition - pos;
        var angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
        
        if (objectName != "TornadoSpell")
        {
            transform.rotation = Quaternion.AngleAxis(angle, Vector3.forward);
        }
        
        anim = GetComponent<Animator>();
        audio = GetComponent<AudioSource>();

        Vector2 direction = Quaternion.AngleAxis(angleVariation, Vector3.forward) * dir;
        
        direction.Normalize();
        this.gameObject.GetComponent<Rigidbody2D>().velocity = direction * speed;

        Destroy(gameObject, destroyTime);

        audio.Play();

        if (objectName == "fireball")
        {
            InvokeRepeating("spawnFireTrail", 0, 0.1f);
        }

    }

    void OnCollisionEnter2D(Collision2D col)
    {
        //Destroy the projectile when it hit something
        destroyProjectile();
    }

    public void destroyProjectile()
    {
        string objectName = gameObject.name;
        objectName = objectName.Substring(0, objectName.Length - 7);
        
        GetComponent<Rigidbody2D>().velocity = Vector3.zero;
        
        if (objectName == "fireball" || objectName == "BasicSpell")
        {
            anim.SetBool("destroy", true);
            Destroy(gameObject, 0.3f);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    void spawnFireTrail()
    {
        Instantiate(FireTrail, transform.position, Quaternion.identity);
    }
    
}

//