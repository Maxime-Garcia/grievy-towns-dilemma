using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Trukitourne : MonoBehaviour
{
    public GameObject trukitourne;
    public float rotationSpeed;
    public Vector3 axis;
    public bool active;
    private float duration;
    
    
    // Start is called before the first frame update
    void Start()
    {
        trukitourne = GameObject.Find("TruKiTourne");
        
    }

    // Update is called once per frame
    void Update()
    {
        if (active)
        {
            trukitourne.SetActive(true);
            duration = Time.deltaTime * rotationSpeed;
            trukitourne.transform.Rotate(axis * duration);
        }
        else
        {
            trukitourne.SetActive(false);
        }
        
    }
}
